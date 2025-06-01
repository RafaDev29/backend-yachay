
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('careers')
export class Career {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;
}
