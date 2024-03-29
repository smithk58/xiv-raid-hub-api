import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { validateOrReject } from 'class-validator';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { UserCharacter } from './UserCharacter';
import { AlarmDefinition } from './AlarmDefinition';
import { UserSetting } from './UserSetting';

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
    @OneToMany(() => UserCharacter, userCharacter => userCharacter.user)
    characters: UserCharacter[];

    @Exclude()
    @OneToMany(() => RaidGroup, raidGroup => raidGroup.owner)
    raidGroups: RaidGroup[];

    @Exclude()
    @OneToMany(() => AlarmDefinition, alarm => alarm.owner)
    raidGroupAlarms: AlarmDefinition[];

    @Exclude()
    @OneToMany(() => UserSetting, setting => setting.user)
    settings: UserSetting[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
