import { Router } from 'express';
import apiRoutes from './api';
import db from '../db';

const router = Router();

router.use('/api', apiRoutes);

router.get('/', (req, res) => {
    res.render('website/index');
});

router.get('/beamer', (req, res) => {
    res.render('beamer');
});

router.get('/schedule', (req, res) => {
    const sql = "SELECT id, title, details, can_subscribe FROM activities WHERE starts_at > date('now')";
    db.all(sql, (err, rows) => {
        if (err !== null) {
            // TODO: render error page
            return;
        }

        res.render('website/schedule', { activities: rows });
    });
});

router.get('/activity/:activityId([0-9]+)', (req, res) => {
    const activityId = parseInt(req.params.activityId);

    const sql = "SELECT id, title, details, can_subscribe FROM activities WHERE id = ?";
    db.get(sql, [activityId], (err, activity) => {
        if (err !== null || activity === null) {
            // TODO: render error page
            console.log(err);
            return;
        }

        const sql = "SELECT id, hostname FROM subscriptions WHERE activity_id = ?";
        db.all(sql, [activityId], (err, rows) => {
            if (err !== null) {
                // TODO: render error page
                console.log(err);
                return;
            }

            activity.subscriptions = rows;

            res.render('website/activity', { activity });
        });
    });
});

export default router;
