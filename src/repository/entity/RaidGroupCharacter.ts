import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { IsIn, IsInt, validateOrReject } from 'class-validator';
import { Exclude, Type } from 'class-transformer';

import { RaidGroup } from './RaidGroup';
import { Character } from './Character';
import { XIVClasses } from '../../constants';

@Index(['raidGroupId'])
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

    @Type(() => Character)
    @ManyToOne(() => Character, character => character.raidGroupCharacters, {cascade: ['insert']})
    @JoinColumn({name: 'characterId'})
    character: Character;

    @Exclude()
    @ManyToOne(() => RaidGroup, raidGroup => raidGroup.characters)
    @JoinColumn({name: 'raidGroupId'})
    raidGroup: RaidGroup;

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
    isEqual(comparisonCharacter: RaidGroupCharacter) {
            const characterIdA = this.character ? this.character.id : this.characterId;
            const characterIdB = comparisonCharacter.character ? comparisonCharacter.character.id : comparisonCharacter.characterId;
            // Ensure the target class/order/character are the same, we don't care if actual character properties changed (e.g. name/server)
            return this.defaultClass === comparisonCharacter.defaultClass
            && this.order === comparisonCharacter.order
            && (characterIdA === characterIdB);
    }
}
