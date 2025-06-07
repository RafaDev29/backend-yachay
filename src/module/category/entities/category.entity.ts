import { Preference } from 'src/module/preferences/entities/preference.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => Preference, preference => preference.category)
  preferences: Preference[];
}
