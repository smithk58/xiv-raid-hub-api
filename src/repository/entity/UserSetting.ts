import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './User';

@Entity({name: 'user_setting'})
export class UserSetting {
    constructor(userId: number, key: string, value: string) {
        this.userId = userId;
        this.key = key;
        this.value = value;
    }
    @PrimaryColumn()
    userId: number;

    @PrimaryColumn({length: 50})
    key: string;

    @Column({length: 100})
    value: string;

    @Exclude()
    @ManyToOne(type => User, user => user.settings, {nullable: false})
    @JoinColumn({name: 'userId'})
    user: User;
}
