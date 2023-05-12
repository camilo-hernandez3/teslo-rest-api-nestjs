import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';


import { ProductImage } from './product-image.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity({name:'products'})
export class Product {

  @ApiProperty({
    example:'9ec191ea-5f80-40df-9255-5513fd86021d',
    description: 'product ID',
    uniqueItems: true
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example:'T-shirt teslo',
    description: 'product title',
    uniqueItems: true
  })
  @Column('text', {
    unique: true,
  })
  title: string;

  @ApiProperty({
    example:'0',
    description: 'product price',
    default: 0
  })
  @Column('float', {
    default: 0,
  })
  price: number;


  @ApiProperty({
    example:'Excepteur magna magna deserunt voluptate esse est sint.',
    description: 'product description',
    default: null
  })
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @ApiProperty({
    example:'T_shirt_teslo',
    description: 'product slug',
    uniqueItems: true
  })
  @Column('text', {
    unique: true,
  })
  slug: string;

  @ApiProperty({
    example:10,
    description: 'product stock',
    default: 0
  })
  @Column('int', {
    default: 0,
  })
  stock: number;

  @ApiProperty({
    example:['x', 'xs', 'm'],
    description: 'product sizes',
  })
  @Column('text', {
    array: true,
  })
  sizes: string[];


  @ApiProperty({
    example:'women',
    description: 'product gender',
  })
  @Column('text')
  gender: string;

  
  @ApiProperty()
  @Column('text',{
    array: true,
    default:[]
  })
  tags: string[];

  //images
  @OneToMany(
    ()=> ProductImage,
    (productImage) => productImage.product,
    {cascade: true, eager: true}
  )
  images?: ProductImage[];

  @ManyToOne( 
    ()=>User,
    (user)=>user.product,
    { eager: true }
  )
  user:User;


  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }


  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
