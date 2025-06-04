

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Preference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;
}
