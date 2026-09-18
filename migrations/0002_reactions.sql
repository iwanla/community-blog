ALTER TABLE posts ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN dislikes INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS reactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id     INTEGER NOT NULL,
    fingerprint TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('like', 'dislike')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(post_id, fingerprint),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_fingerprint ON reactions(fingerprint);

CREATE TABLE IF NOT EXISTS view_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id     INTEGER NOT NULL,
    fingerprint TEXT NOT NULL,
    viewed_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(post_id, fingerprint),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE INDEX IF NOT EXISTS idx_view_logs_post_id ON view_logs(post_id);
