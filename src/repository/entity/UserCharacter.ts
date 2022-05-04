import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Exclude, Type } from 'class-transformer';
import { IsIn, IsOptional, validateOrReject } from 'class-validator';

import { Character } from './Character';
import { User } from './User';
import { XIVClasses } from '../../constants';

@Index(['userId'])
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

    @Type(() => Character)
    @ManyToOne(() => Character, character => character.raidGroupCharacters, {cascade: ['insert', 'update']})
    @JoinColumn({name: 'characterId'})
    character: Character;

    @Type(() => User)
    @ManyToOne(() => User, user => user.characters)
    @JoinColumn({name: 'userId'})
    user: User;

    @Exclude()
    @Column({default: false})
    isOwner: boolean;

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
