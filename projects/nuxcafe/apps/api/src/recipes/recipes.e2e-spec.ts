import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

describe("Recipes (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ingredientSlug = "e2e-recipe-ingredient";
  const menuItemSlug = "e2e-recipe-item";

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);

    await prisma.recipeItem.deleteMany({
      where: { ingredient: { slug: ingredientSlug } },
    });
    await prisma.recipe.deleteMany({
      where: { menuItem: { slug: menuItemSlug } },
    });
    await prisma.menuItem.deleteMany({ where: { slug: menuItemSlug } });
    await prisma.ingredient.deleteMany({ where: { slug: ingredientSlug } });

    await prisma.ingredient.create({
      data: {
        slug: ingredientSlug,
        name: "E2E Recipe Ingredient",
        unit: "G",
        costCents: 10,
        quantity: 100,
        minQuantity: 10,
      },
    });
    await prisma.menuItem.create({
      data: {
        slug: menuItemSlug,
        name: "E2E Recipe Item",
        category: "OTHER",
        priceCents: 200,
      },
    });
  });

  afterAll(async () => {
    await prisma.recipeItem.deleteMany({
      where: { ingredient: { slug: ingredientSlug } },
    });
    await prisma.recipe.deleteMany({
      where: { menuItem: { slug: menuItemSlug } },
    });
    await prisma.menuItem.deleteMany({ where: { slug: menuItemSlug } });
    await prisma.ingredient.deleteMany({ where: { slug: ingredientSlug } });
    await app.close();
  });

  it("GET /api/recipes/:menuItemSlug returns null recipe when unset", async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/recipes/${menuItemSlug}`)
      .expect(200);

    expect(response.body.menuItem.slug).toBe(menuItemSlug);
    expect(response.body.recipe).toBeNull();
  });

  it("PUT /api/recipes/:menuItemSlug creates the recipe", async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/recipes/${menuItemSlug}`)
      .send({
        items: [{ ingredientSlug, quantity: 25.5 }],
      })
      .expect(200);

    expect(response.body.recipe.items).toHaveLength(1);
    expect(response.body.recipe.items[0]).toMatchObject({
      quantity: 25.5,
      ingredient: expect.objectContaining({ slug: ingredientSlug }),
    });
    // 25.5g x 10 cents = 255 cents ingredient cost.
    expect(response.body.recipe.totalCostCents).toBe(255);
  });

  it("PUT /api/recipes/:menuItemSlug replaces the recipe wholesale", async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/recipes/${menuItemSlug}`)
      .send({
        items: [
          { ingredientSlug, quantity: 10 },
        ],
      })
      .expect(200);

    expect(response.body.recipe.items).toHaveLength(1);
    expect(response.body.recipe.items[0].quantity).toBe(10);
    expect(response.body.recipe.totalCostCents).toBe(100);
  });

  it("PUT /api/recipes/:menuItemSlug rejects unknown ingredients", async () => {
    await request(app.getHttpServer())
      .put(`/api/recipes/${menuItemSlug}`)
      .send({ items: [{ ingredientSlug: "no-such-ingredient", quantity: 1 }] })
      .expect(400);
  });

  it("PUT /api/recipes/:menuItemSlug rejects duplicate ingredients", async () => {
    await request(app.getHttpServer())
      .put(`/api/recipes/${menuItemSlug}`)
      .send({
        items: [
          { ingredientSlug, quantity: 1 },
          { ingredientSlug, quantity: 2 },
        ],
      })
      .expect(400);
  });

  it("DELETE /api/recipes/:menuItemSlug removes the recipe", async () => {
    await request(app.getHttpServer())
      .delete(`/api/recipes/${menuItemSlug}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/api/recipes/${menuItemSlug}`)
      .expect(200);

    expect(response.body.recipe).toBeNull();
  });

  it("returns 404 for unknown menu items", async () => {
    await request(app.getHttpServer())
      .get("/api/recipes/no-such-menu-item")
      .expect(404);
  });
});
