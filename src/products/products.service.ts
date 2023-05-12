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
import { DataSource, Repository } from 'typeorm';

import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage, Product } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productoRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) {}

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const producto = this.productoRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
          
        ),
        user
      });

      await this.productoRepository.save(producto);

      return { ...producto, images: images };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productoRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return products.map((product)=> ({
      ...product,
      images: product.images.map(img=> img.url)
    }))
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {

      product = await this.productoRepository.findOneBy({ id: term });

    } else {

      const queryBuilder = this.productoRepository.createQueryBuilder('prod');

      product = await queryBuilder
        .where('UPPER(title) = :title or slug = :slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
        
    }

    if (!product) throw new NotFoundException(`Product with ${term} not found`);

    return product;
  }


  async findOnePlain(term:string){

    const {images=[], ...rest} = await this.findOne(term);

    return {
      ...rest,
      images: images.map(image => image.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto,  user: User) {

    const {images, ...toUpdate}= updateProductDto;



    const product = await this.productoRepository.preload({
      id,
      ...toUpdate
    });


    if (!product)
      throw new NotFoundException(`product with id ${id} not found`);

    
    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if(images){
        await queryRunner.manager.delete(ProductImage, {product:{id}});

        product.images = images.map(
          image => this.productImageRepository.create({url:image}));

        await queryRunner.manager.save(product);

      }

      //await this.productoRepository.save(product);
      product.user = user;
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return this.findOnePlain(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productoRepository.remove(product);

    return 'The product was removed';
  }

  private handleExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  async deleteAllProduct(){
    const query =  this.productoRepository.createQueryBuilder('product');

    try {

      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleExceptions(error);
    }
  }
}
