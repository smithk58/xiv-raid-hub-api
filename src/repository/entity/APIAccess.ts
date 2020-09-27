import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'api_access'})
export class APIAccess {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    key: string;

    @Column({length: 255})
    description: string;

    @Column({type: 'timestamp'})
    createdOn: Date;
}
