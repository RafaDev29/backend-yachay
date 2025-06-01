
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('academic')
export class Academic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}