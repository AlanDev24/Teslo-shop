import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginatioDto } from 'src/common/dtos/paginatio.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRepository.create(createProductDto);

      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginatioDto: PaginatioDto) {
    const { limit = 10, offset = 0 } = paginatioDto;

    try {
      const products = await this.productRepository.find({
        take: 10,
        skip: offset,
        //TODO relaciones
      });
      return {
        products,
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
        .where(`UPPER(title)= :title or slug= :slug`, {
          title: term.toUpperCase(),
          slug: term.toLocaleLowerCase(),
        })
        .getOne();
    }
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
    });

    if (!product) {
      throw new NotFoundException(`Product woth id ${id} not found`);
    }
    try {
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      const product = await this.findOne(id);
      await this.productRepository.remove(product);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private handleExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected error, check server logs!',
    );
  }
}
