import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToMany, PrimaryColumn } from 'typeorm';
import { validateOrReject } from 'class-validator';
import { Exclude } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { RaidGroupCharacter } from './RaidGroupCharacter';

@Entity({name: 'characters'})
export class Character {
    @PrimaryColumn()
    id: number;

    @Column({length: 30})
    name: string;

    @Column({length: 30})
    server: string;

    defaultClass: string;

    @Exclude()
    @ManyToMany(type => RaidGroup)
    raidGroupCharacters?: RaidGroupCharacter[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
