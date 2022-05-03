import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsOptional, validateOrReject } from 'class-validator';
import { Exclude, Type } from 'class-transformer';

import { RaidGroupCharacter } from './RaidGroupCharacter';
import { User } from './User';
import { WeeklyRaidTime } from './WeeklyRaidTime';
import { AlarmDefinition } from './AlarmDefinition';

@Entity({name: 'raid_groups'})
export class RaidGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 30})
    name: string;

    @IsOptional()
    @Column({length: 12, nullable: true})
    purpose: string;

    @Exclude()
    @Column({default: false})
    hasSchedule: boolean;

    @IsBoolean()
    @Column({default: true})
    hasCharacters: boolean;

    @IsBoolean()
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

    @Type(() => RaidGroupCharacter)
    @OneToMany(type => RaidGroupCharacter, character => character.raidGroup, {cascade: true})
    characters: RaidGroupCharacter[];

    @Exclude()
    @OneToMany(type => WeeklyRaidTime, raidTime => raidTime.raidGroup, {onDelete: 'CASCADE'})
    weeklyRaidTimes: WeeklyRaidTime[];

    @Exclude()
    @OneToMany(type => AlarmDefinition, alarm => alarm.raidGroup)
    alarms: AlarmDefinition[];

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }

    isEqualCharacters(comparisonCharacters: RaidGroupCharacter[]): boolean {
        // Check if the arrays are both defined and of equal length
        if (!this.characters && !comparisonCharacters) {
           return true;
        } else if (
            (!this.characters && comparisonCharacters)
            || (this.characters && !comparisonCharacters)
            || this.characters.length !== comparisonCharacters.length
        ) {
            return false;
        }
        // Use RaidGroupCharacter.isEqual method to compare each character
        for (let i = 0; i < this.characters.length; i++) {
            const characterA = this.characters[i];
            const characterB = comparisonCharacters[i];
            if (!characterA.isEqual(characterB)) {
                return false;
            }
        }
        return true;
    }
    getNewCharacterIds(comparisonCharacters: RaidGroupCharacter[]) {
        if (!comparisonCharacters || comparisonCharacters.length === 0) {
            return [];
        } else if (!this.characters) {
            return comparisonCharacters.map((rgChar) => rgChar.character ? rgChar.character.id : rgChar.characterId);
        }
        // Build a set of existing IDs to check against the incoming characters
        const existingIds = this.characters.reduce((set, rgChar) => {
            const characterId = rgChar.character ? rgChar.character.id : rgChar.characterId;
            set.add(characterId);
            return set;
        }, new Set());
        const newIds = [];
        for (const rgChar of comparisonCharacters) {
            // Add the character ID if it doesn't exist in the set of current IDs
            const characterId = rgChar.character ? rgChar.character.id : rgChar.characterId;
            if (!existingIds.has(characterId)) {
                newIds.push(characterId);
            }
        }
        return newIds;
    }
}
