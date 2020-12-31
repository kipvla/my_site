DROP TABLE IF EXISTS blogs;

CREATE TABLE blogs (id serial primary key, title VARCHAR(50) not null, body text not null, date datetime not null, image text not null);

INSERT INTO blogs (title, body, date, image) VALUES ("First Post", "This is my first post. Yay!", "2020-12-12 22:43:12.463406", "images/kr10.jpg");
INSERT INTO blogs (title, body, date, image) VALUES ("Time for #2", "Something unique!", "2020-12-16 17:07:30.055948 ", "images/kr11.jpg");