import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsIn, IsInt, Max, Min, validateOrReject } from 'class-validator';
import { Exclude } from 'class-transformer';

import { AlarmDefinition } from './AlarmDefinition';
import { WeeklyRaidTime } from './WeeklyRaidTime';

@Index(['utcHour', 'utcMinute'])
@Entity({name: 'raid_group_alarms'})
export class Alarm {
    // All parameters must remain optional for TypeORM.
    constructor(alarmDefId: number, weeklyRaidTimeId?: number, utcHour?: number, utcMinute?: number, utcWeekMask?: number) {
        this.alarmDefinitionId = alarmDefId;
        this.weeklyRaidTimeId = weeklyRaidTimeId;
        this.utcHour = utcHour;
        this.utcMinute = utcMinute;
        this.utcWeekMask = utcWeekMask;
    }
    @PrimaryGeneratedColumn()
    id: number;

    @IsInt()
    @Min(0)
    @Max(23)
    @Column()
    utcHour: number;

    @IsInt()
    @Min(0)
    @Max(59)
    @IsIn([0, 15, 30, 45], {message: 'Minutes must be 0, 15, 30, or 45.'})
    @Column()
    utcMinute: number;

    @IsInt()
    @Column()
    utcWeekMask: number;

    @Column({name: 'weeklyRaidTimeId'})
    weeklyRaidTimeId: number;

    @Exclude()
    @ManyToOne(type => WeeklyRaidTime, wrt => wrt.alarms, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'weeklyRaidTimeId'})
    weeklyRaidTime: WeeklyRaidTime;

    @Column({name: 'alarmDefinitionId'})
    alarmDefinitionId: number;

    @Exclude()
    @ManyToOne(type => AlarmDefinition, alarmDef => alarmDef.alarms, {nullable: false, onDelete: 'CASCADE'})
    @JoinColumn({name: 'alarmDefinitionId'})
    alarmDefinition: AlarmDefinition;

    @BeforeInsert()
    @BeforeUpdate()
    private validate(): Promise<void> {
        return validateOrReject(this, {validationError: {target: false}});
    }
}
