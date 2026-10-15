import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new ConflictException("endsAt must be after startsAt");
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service not found`);
    }

    if (service.durationMinutes <= 0) {
      throw new NotFoundException(`Service has invalid duration`);
    }

    const durationMs = endsAt.getTime() - startsAt.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (Math.round(durationMinutes) !== service.durationMinutes) {
      throw new ConflictException(
        `Booking duration must match service duration`,
      );
    }

    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility not found`);
    }

    if (!facility.isActive) {
      throw new ConflictException(`Facility is not active`);
    }

    const targetService = await this.prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        facilityId: dto.facilityId,
        isActive: true,
      },
    });

    if (!targetService) {
      throw new NotFoundException(`Service not found or not active at this facility`);
    }

    const totalFacilityBookings = await this.prisma.booking.count({
      where: {
        facilityId: dto.facilityId,
        status: { not: "CANCELLED" },
      },
    });

    if (totalFacilityBookings >= (facility.capacity || 0)) {
      throw new ConflictException(
        `Facility is at full capacity`,
      );
    }

    const booking = await this.prisma.booking.create({
      data: {
        startsAt,
        endsAt,
        status: "PENDING",
        user: { connect: { id: dto.userId } },
        facility: { connect: { id: dto.facilityId } },
        service: { connect: { id: dto.serviceId } },
      },
    });

    return booking;
  }
}