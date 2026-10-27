import {hasRole} from '@/lib/security';
import {notFound} from 'next/navigation';
import {WordPressMigration} from '@/components/migration/WordPressMigration';
export default async function MigrationPage(){
 if(!await hasRole('ADMIN'))notFound();
 return <WordPressMigration/>;
}
