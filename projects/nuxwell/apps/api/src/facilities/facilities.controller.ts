import { Controller, Get, Param, Query } from "@nestjs/common";
import { FacilityQueryDto } from "./dto/facility-query.dto";
import { FacilitiesService } from "./facilities.service";

@Controller("facilities")
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  /** List facilities with optional search, pagination and status filter. */
  @Get()
  findAll(@Query() query: FacilityQueryDto) {
    return this.facilitiesService.findAll(query);
  }

  /** Get a single facility by slug, including its active services. */
  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.facilitiesService.findBySlug(slug);
  }
}
