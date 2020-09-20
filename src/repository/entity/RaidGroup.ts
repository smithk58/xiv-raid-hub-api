import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ArrayMaxSize, ArrayMinSize, IsOptional } from 'class-validator';
import { Exclude, Type } from 'class-transformer';

import { RaidGroupCharacter } from './RaidGroupCharacter';
import { User } from './User';
import { WeeklyRaidTime } from './WeeklyRaidTime';

@Entity({name: 'raid_groups'})
export class RaidGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 30})
    name: string;

    @IsOptional()
    @Column({length: 10, nullable: true})
    purpose: string;

    @Column({default: false})
    hasSchedule: boolean;

    @Column()
    share: boolean;

    @Exclude()
    isOwner?: boolean;

    @Exclude()
    @Column({name: 'ownerId'})
    ownerId: number;

    @Exclude()
    @ManyToOne(type => User, user => user.raidGroups, {nullable: false})
    @JoinColumn({name: 'ownerId'})
    owner: User;

    @ArrayMinSize(8)
    @ArrayMaxSize(8)
    @Type(() => RaidGroupCharacter)
    @OneToMany(type => RaidGroupCharacter, character => character.raidGroup, {cascade: true})
    characters: RaidGroupCharacter[];

    @Exclude()
    @OneToMany(type => WeeklyRaidTime, raidTime => raidTime.raidGroup, {cascade: ['remove']})
    weeklyRaidTimes: WeeklyRaidTime[];
}
