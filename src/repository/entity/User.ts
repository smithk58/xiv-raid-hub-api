import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { validateOrReject } from 'class-validator';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { UserCharacter } from './UserCharacter';
import { Alarm } from './Alarm';

@Entity({name: 'users'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 64, unique: true})
    discordId: string;

    @Column({length: 32})
    username: string;

    @Column({length: 255})
    email: string;

    @Column({length: 50, nullable: true})
    timezone: string;

    @Column({type: 'timestamp'})
    createdOn: Date;

    @Column({type: 'timestamp'})
    lastLogin: Date;

    @Exclude()
    @OneToMany(type => UserCharacter, userCharacter => userCharacter.user)
    characters: UserCharacter[];

    @Exclude()
    @OneToMany(type => RaidGroup, raidGroup => raidGroup.owner)
    raidGroups: RaidGroup[];

    @Exclude()
    @OneToMany(type => Alarm, alarm => alarm.owner)
    raidGroupAlarms: Alarm[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
