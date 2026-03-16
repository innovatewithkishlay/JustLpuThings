import { AdminDashboardService } from './src/modules/admin/admin.dashboard.service';
import { pool } from './src/config/db';

async function verify() {
    console.log('--- Traffic Data Verification ---');
    try {
        const history = await AdminDashboardService.getTrafficHistory(7);
        console.table(history);

        const overview = await AdminDashboardService.getOverview();
        console.log('Overview Stats:', {
            visitsToday: overview.visitsToday,
            trafficToday: overview.trafficToday
        });

        console.log('--- Verification Done ---');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

verify();
