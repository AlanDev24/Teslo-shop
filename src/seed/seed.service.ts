import { Inject, Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(
    @Inject(ProductsService)
    private readonly productsService: ProductsService,
  ) {}

  async runSeed() {
    await this.insertNewProducts();

    const seedProducts = initialData.products;

    const insertPromises = [];

    seedProducts.forEach((product) => {
      insertPromises.push(this.productsService.create(product));
    });

    await Promise.all(insertPromises)

    return 'SEED EXECUTED';
  }

  private async insertNewProducts() {
    this.productsService.deleteAllProducts();
    return true;
  }
}
