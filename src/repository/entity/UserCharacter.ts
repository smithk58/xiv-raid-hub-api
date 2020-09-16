import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Exclude, Type } from "class-transformer";

import { Character } from "./Character";
import { User } from "./User";
import { IsIn, IsOptional, validateOrReject } from "class-validator";
import { XIVClasses } from "../../constants";

@Entity({name: 'user_characters'})
export class UserCharacter {
    @PrimaryColumn({name: 'characterId'})
    characterId: number;

    @PrimaryColumn({name: 'userId'})
    userId: number;

    @IsIn(XIVClasses, {message: 'Must be a valid FFXIV class.'})
    @IsOptional()
    @Column({length: 30})
    defaultClass: string;

    @Type(()=> Character)
    @ManyToOne(type => Character, character => character.raidGroupCharacters,{primary: true, cascade: ['insert', 'update']})
    @JoinColumn({name: 'characterId'})
    character: Character;

    @Type(()=> User)
    @ManyToOne(type => User, user => user.characters,{primary: true})
    @JoinColumn({name: 'userId'})
    user: User;

    @Exclude()
    @Column({default: false})
    isOwner: boolean;

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this);
    }
}
