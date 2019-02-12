import * as express from 'express';
import { Server } from 'http';
import * as socketIo from 'socket.io';
import * as sqlite3 from 'sqlite3';
import * as bodyParser from 'body-parser';
import * as dns from 'dns';

const app = express();
app.use(bodyParser.json())
const server = new Server(app);
const io = socketIo(server);

// first initialize the database
const db = new sqlite3.Database('database.sqlite');
db.serialize(() => {
    db.run("PRAGMA foreign_keys=OFF");
    db.run("BEGIN TRANSACTION");

    // shoutbox
    db.run("CREATE TABLE IF NOT EXISTS shoutbox " +
        "(id integer not null primary key autoincrement, " +
        "username varchar not null, " +
        "body text not null, " +
        "sent_at varchar not null)");

    // activities
    db.run("CREATE TABLE IF NOT EXISTS activities " +
        "(id integer not null primary key autoincrement, " +
        "title varchar not null, " +
        "details varchar not null, " +
        "can_subscribe boolean not null check(can_subscribe in(0, 1)), " +
        "starts_at datetime not null)");

    // activities data
    db.run("DELETE FROM activities");

    db.run("INSERT INTO activities VALUES " +
        "(1, " +
        "'Tournament: Xonotic', " +
        "'Main room, Saturday at 12:00', " +
        "1," +
        "'2019-02-16 12:00:00')");

    db.run("INSERT INTO activities VALUES " +
        "(2, " +
        "'Tournament: Keep Talking and Nobody Explodes', " +
        "'Main room stage, Saturday at 16:00', " +
        "1," +
        "'2019-02-16 16:00:00')");

    db.run("INSERT INTO activities VALUES " +
        "(3, " +
        "'Dinner: Fries & Snacks', " +
        "'Courtyard, Saturday at 19:00', " +
        "0," +
        "'2019-02-16 19:00:00')");

    db.run("INSERT INTO activities VALUES " +
        "(4, " +
        "'Tournament: Just Dance', " +
        "'Downstairs lounge, Saturday at 23:00', " +
        "0," +
        "'2019-02-16 23:00:00')");

    db.run("INSERT INTO activities VALUES " +
        "(5, " +
        "'Tournament: Rocket League', " +
        "'Downstairs lounge, Sunday at 12:00', " +
        "1," +
        "'2019-02-17 12:00:00')");

    db.run("CREATE TABLE IF NOT EXISTS subscriptions " +
        "(id integer not null primary key autoincrement, " +
        "activity_id inter not null," +
        "hostname varchar not null," +
        "FOREIGN KEY (activity_id) REFERENCES activities(id), " +
        "UNIQUE(activity_id, hostname))");

    db.run("CREATE TABLE IF NOT EXISTS nicknames " +
		"(hostname varchar not null primary key, " +
		"nick varchar not null)");

    // set the activities sequence correctly
    db.run("DELETE FROM sqlite_sequence");
    db.run("INSERT INTO sqlite_sequence VALUES ('activities', 5)");

    db.run("COMMIT");
});


const port = 3030;
server.listen(port);

app.get('/', (req, res) => res.send('Hello, World!'));

// TODO: Set this only in development
if (true) {
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept',
        );
        next();
    });
}

app.get('/api/nick', (req, res) => {
    getNickAndHostnameFromIp(req.connection.remoteAddress, (nick, hostname) => {
        res.json({ nick });
    });
});

app.post('/api/nick', (req, res) => {
	if (req.body.nick === undefined || typeof req.body.nick !== 'string') {
		res.status(400).json({error: "No nick given"});
		return;
	}

	const nick = req.body.nick;

	// get the hostnme
	getHostnameFromIp(req.connection.remoteAddress, hostname => {
		// check if we already have a username
		const sql = "SELECT hostname FROM nicknames WHERE hostname = ?";
		db.all(sql, [hostname], (err, rows) => {
			if (err !== null) {
				console.log(err);
				return;
			}

			if (rows.length > 0) {
				const sql = "UPDATE nicknames SET nick = ? WHERE hostname = ?";
				db.run(sql, [nick, hostname], err => {
					if (err !== null) {
						console.log(err);
						return;
					}

					res.json("Nickname updated");
				})
			} else {
				const sql = "INSERT INTO nicknames VALUES (?, ?)";
				db.run(sql, [hostname, nick], err => {
					if (err !== null) {
						console.log(err);
						return;
					}

					res.json("Nickname created");
				})
			}
		})
	});
});

app.get('/api/shoutbox', (req, res) => {
    // for now, we simply do not allow scroll back, just send the last 20 messages
    const sql = "SELECT id, username, body, sent_at FROM shoutbox ORDER BY id ASC LIMIT 20";
    db.all(sql, (err, rows) => {
        if (err !== null) {
            console.log(err);
            return;
        }

        const messages = rows.map(row => ({
            id: row.id,
            username: row.username,
            body: row.body,
            time: row.sent_at
        }));

        res.json({ messages });
    });
});

app.post('/api/shoutbox', (req, res) => {
    if (req.body.body === undefined || typeof req.body.body !== 'string') {
        res.status(400).json({ error: "No message given" });
        return;
    }

    getHostnameFromIp(req.connection.remoteAddress, hostname => {
        sendMessage(hostname, req.body.body);

        res.json("Message sent");
    })
});

app.get('/api/activities', (req, res) => {
    const sql = "SELECT id, title, details, can_subscribe FROM activities WHERE starts_at > datetime('now')";
    db.all(sql, (err, activities) => {
        if (err !== null) {
            console.log(err);
            return;
        }

        res.json({ activities });
    });
});

app.get('/api/activities/:activityId([0-9]+)/subscriptions', (req, res) => {
    if (req.params.activityId === undefined) {
        res.status(400).json({error: "No activity specified"});
        return;
    }
	let activityId = parseInt(req.params.activityId, 10);

	const sql = "SELECT id, activity_id, hostname FROM subscriptions WHERE activity_id = ?";
	db.all(sql, [activityId], (err, subscriptions) => {
	    if (err !== null) {
	        console.log(err);
	        return;
        }

	    res.json({subscriptions});
    })
});

app.post('/api/activities/:activityId([0-9]+)/subscriptions', (req, res) => {
	if (req.params.activityId === undefined) {
	    res.status(400).json({error: "No activity specified"});
	    return;
    }
	let activityId = parseInt(req.params.activityId, 10);

	const sql = "SELECT id, can_subscribe FROM activities WHERE id = ?";
	db.get(sql, [ activityId ], (err, row) => {
	    if (err !== null) {
	        console.log(err);
	        return;
        }

	    if (row.can_subscribe != 1) {
	        res.status(403).json({error: "Cannot subscribe to this activity"});
	        return;
        }

	    // get the hostname and insert

        getHostnameFromIp(req.connection.remoteAddress, hostname => {
        	const sql = "INSERT INTO subscriptions VALUES (NULL, ?, ?)";
        	db.run(sql, [activityId, hostname], err => {
        	    if (err !== null) {
        	        res.status(400).json({error: "Already subscribed"});
        	        return;
                }
                res.json("Subscribed to activity");
            });
        });
    })
});

// websocket for shoutbox events
const shoutbox = io.of('/shoutbox');

function sendMessage(username: string, body: string, time = new Date()) {
    // save the message in the database
    const sql = "INSERT INTO shoutbox (id, username, body, sent_at) VALUES (NULL, ?, ?, ?)";
    db.run(sql, [username, body, time.toJSON()], function(err) {
        if (err !== null) {
            console.log("SQLite error!", err);
            return;
        }
        // emit the message to the shoutbox
        const message = {
            id: this.lastID,
            username,
            body,
            time
        };
        shoutbox.emit('shoutbox message', message);
    });

}

function getHostnameFromIp(ip : string, callback = (hostname: string) => {}) {
	dns.reverse(ip, (err, domains) => {
        let hostname = domains[0];

        for (let i in domains) {
            let domain = domains[i];
            if (domain.endsWith(".gepwnage.lan")) {
                hostname = domain.replace(".gepwnage.lan", "");
                break;
            }
            if (domain !== 'localhost') {
                hostname = domain;
            }
        }

        callback(hostname);
    });
}

function getNickAndHostnameFromIp(ip : string, callback = (nick: string, hostname: string) => {}) {
    getHostnameFromIp(ip, hostname => {
        const sql = "SELECT nick FROM nicknames WHERE hostname = ?";
        db.all(sql, [hostname], (err, rows) => {
            if (err !== null) {
                console.log(err);
                return;
            }

            let nick = null;

            if (rows.length > 0) {
                nick = rows[0].nick;
            }

            callback(nick, hostname);
        });
    });
}