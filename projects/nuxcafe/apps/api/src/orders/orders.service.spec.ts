import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const menuItem = {
    id: "menu-item-1",
    slug: "e2e-espresso",
    name: "E2E Espresso",
    priceCents: 300,
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            menuItem: {
              findMany: jest.fn(),
            },
            orderItem: {
              create: jest.fn(),
            },
            production: {
              create: jest.fn(),
              updateMany: jest.fn(),
            },
            recipe: {
              findUnique: jest.fn(),
            },
            ingredient: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            stockMovement: {
              create: jest.fn(),
            },
            sale: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
    prisma = moduleRef.get(PrismaService);
  });

  it("rejects an order without items", async () => {
    await expect(service.create({ items: [] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects an order with an unknown menu item", async () => {
    (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);

    await expect(
      service.create({ items: [{ menuItemSlug: "no-such-item", quantity: 1 }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates an order with a queued production run per line", async () => {
    (prisma.menuItem.findMany as jest.Mock).mockResolvedValue([menuItem]);

    const createdOrder = {
      id: "order-1",
      number: "NC-TEST",
      status: "PENDING",
      totalCents: 0,
    };
    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<string>) =>
        callback({
          order: {
            create: jest.fn().mockResolvedValue(createdOrder),
            update: jest.fn().mockResolvedValue({}),
          },
          // Reuse the outer mocks so the assertions below observe
          // the calls made inside the transaction.
          orderItem: { create: prisma.orderItem.create },
          production: { create: prisma.production.create },
        }) as unknown as string,
    );

    const findUniqueMock = jest.fn().mockResolvedValue({
      ...createdOrder,
      totalCents: 600,
      items: [],
      productions: [],
      sale: null,
    });
    (prisma.order.findUnique as jest.Mock).mockImplementation(findUniqueMock);

    const order = await service.create({
      items: [{ menuItemSlug: "e2e-espresso", quantity: 2 }],
    });

    expect(order.number).toBe("NC-TEST");
    expect(prisma.orderItem.create).toHaveBeenCalledTimes(1);
    expect(prisma.production.create).toHaveBeenCalledTimes(1);
  });

  it("rejects completing an already completed order", async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: "order-1",
      status: "COMPLETED",
      items: [],
    });

    await expect(service.complete("order-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects completing an order with insufficient stock", async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: "order-1",
      number: "NC-TEST",
      status: "PENDING",
      totalCents: 300,
      items: [
        {
          menuItemId: "menu-item-1",
          quantity: 10,
          menuItem: { slug: "e2e-espresso", priceCents: 300 },
        },
      ],
    });
    (prisma.recipe.findUnique as jest.Mock).mockResolvedValue({
      id: "recipe-1",
      items: [
        { ingredientId: "ingredient-1", quantity: 18 },
      ],
    });
    (prisma.ingredient.findMany as jest.Mock).mockResolvedValue([
      { id: "ingredient-1", name: "Espresso Beans", unit: "G", quantity: 100 },
    ]);

    await expect(service.complete("order-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
