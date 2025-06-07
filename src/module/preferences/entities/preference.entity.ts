import { Category } from 'src/module/category/entities/category.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Preference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'category_id', default: "09097b5f-b598-4c90-9305-6cc69971f5aa" })
  categoryId: string;

  @ManyToOne(() => Category, category => category.preferences)
  @JoinColumn({ name: 'category_id' })
  category?: Category;
}
