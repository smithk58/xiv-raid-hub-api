import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './User';

@Entity({name: 'user_settings'})
export class UserSetting {
    @PrimaryColumn()
    userId: number;

    @PrimaryColumn({length: 50})
    key: string;

    @Column({length: 100})
    value: string;

    @Exclude()
    @ManyToOne(() => User, user => user.settings, {nullable: false})
    @JoinColumn({name: 'userId'})
    user: User;

    constructor(userId: number, key: string, value: string) {
        this.userId = userId;
        this.key = key;
        this.value = value;
    }
}
