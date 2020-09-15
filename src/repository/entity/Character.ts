import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { IsIn, IsOptional, validateOrReject } from "class-validator";
import { Exclude } from "class-transformer";

import { RaidGroup } from "./RaidGroup";
import { RaidGroupCharacter } from "./RaidGroupCharacter";
import { XIVClasses } from "../../constants";

@Entity({name: 'characters'})
export class Character {
    @PrimaryColumn()
    id: number;

    @Column({length: 30})
    name: string;

    @Column({length: 30})
    server: string;

    @IsIn(XIVClasses, {message: 'Must be a valid FFXIV class.'})
    @IsOptional()
    @Column({length: 30, nullable: true})
    defaultClass?: string;

    @Exclude()
    @ManyToMany(type => RaidGroup)
    raidGroupCharacters?: RaidGroupCharacter[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this);
    }
}
