import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    gender: string;

    @Column({ type: 'date' })
    birthDate: string;

    @Column()
    academicLevelId: string;

    @Column({ nullable: true })
    careerId?: string;
}
