import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert, BeforeUpdate } from "typeorm";
import { validateOrReject } from "class-validator";

import { Character } from "./Character";
import { RaidGroup } from "./RaidGroup";

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

    @Column({type: 'timestamp'})
    createdOn: Date;

    @Column({type: 'timestamp'})
    lastLogin: Date;

    @OneToMany(type => Character, character => character.user)
    characters: Character[];

    @OneToMany(type => RaidGroup, raidGroup => raidGroup.owner)
    raidGroups: RaidGroup[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this);
    }
}
