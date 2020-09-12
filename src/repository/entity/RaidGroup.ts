import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ArrayMaxSize, ArrayMinSize, IsOptional } from "class-validator";
import { Exclude, Type } from "class-transformer";

import { RaidGroupCharacter } from "./RaidGroupCharacter";
import { User } from "./User";

@Entity({name: 'raid_groups'})
export class RaidGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 30})
    name: string;

    @IsOptional()
    @Column({length: 10, nullable: true})
    purpose: string;

    hasSchedule?: boolean; // TODO resolve this on getAll() call

    @Column()
    share: boolean;

    @Exclude()
    @ManyToOne(type => User, user => user.raidGroups, {nullable: false})
    owner: User;

    @ArrayMinSize(8)
    @ArrayMaxSize(8)
    @Type(() => RaidGroupCharacter)
    @OneToMany(type => RaidGroupCharacter, character => character.raidGroup, {cascade: true})
    characters: RaidGroupCharacter[];
}
