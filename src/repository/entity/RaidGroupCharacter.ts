import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { IsIn, IsInt, validateOrReject } from "class-validator";
import { Exclude, Type } from "class-transformer";

import { RaidGroup } from "./RaidGroup";
import { Character } from "./Character";
import { XIVClasses } from "../../constants";

@Entity({name: 'raid_group_character'})
export class RaidGroupCharacter {
    @PrimaryColumn({name: 'characterId'})
    characterId: number;

    @PrimaryColumn({name: 'raidGroupId'})
    raidGroupId: number;

    @Column({length: 30})
    @IsIn(XIVClasses, {message: 'Must be a valid FFXIV class.'})
    defaultClass: string;

    @IsInt()
    @Column()
    order: number;

    @Type(()=> Character)
    @ManyToOne(type => Character, character => character.raidGroupCharacters,{primary: true, cascade: ['insert']})
    @JoinColumn({name: 'characterId'})
    character: Character;

    @Exclude()
    @ManyToOne(type => RaidGroup, raidGroup => raidGroup.characters, {primary: true})
    @JoinColumn({name: 'raidGroupId'})
    raidGroup: RaidGroup;

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this);
    }
}
