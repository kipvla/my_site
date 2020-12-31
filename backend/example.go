package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	// "strings"
	// "testing"
	// "time"
	// "strings"
	// "github.com/jackc/pgproto3/v2"
)

type Blog struct {
	ID    int `db:"id"`
	Title string
	Date  time.Time
	Body  string
	Image string
}

func main() {
	// os.Setenv("DATABASE_URL", "postgresql://localhost/postgres")
	// conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	// if err != nil {
	// 	fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
	// 	os.Exit(1)
	// }
	// defer conn.Close(context.Background())

	// var id int
	// var date time.Time
	// var title string
	// var body string
	// var image string
	// err = conn.QueryRow(context.Background(), "select id, date, title, body, image from blogs").Scan(&id, &date, &title, &body, &image)
	// if err != nil {
	// 	fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	// 	os.Exit(1)
	// }

	dbpwd := os.Getenv("DBPWD")

	db, err := sqlx.Connect("postgres", "user=postgres dbname=postgres password="+dbpwd+" sslmode=disable")
	if err != nil {
		log.Fatalln(err)
	}

	blog := Blog{}
	err = db.Get(&blog, "SELECT * FROM blogs WHERE id = 1")
	fmt.Printf("%#v\n", blog)
	fmt.Printf("%v\n", blog.Title)

	place := Blog{}
	places := make([]Blog, 0)
	rows, err := db.Queryx("SELECT * FROM blogs")
	for rows.Next() {
		err := rows.StructScan(&place)
		if err != nil {
			log.Fatalln(err)
		}
		fmt.Printf("%#v\n", place)
		places = append(places, place)
	}
	fmt.Println(places)

	// var sum int32
	// var rowCount int32
	// for rows.Next() {
	// 	var n int32
	// 	if err := rows.Scan(&n); err != nil {
	// 		fmt.Printf("Row scan failed: %v", err)
	// 	}
	// 	sum += n
	// 	rowCount++
	// }
	// fmt.Println(sum)

	// os.Setenv("DATABASE_URL", "postgresql://localhost/postgres")
	// conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	// rows, err := conn.Query(context.Background(), "select url from images")
	// if err != nil {
	// 	fmt.Printf("conn.Query failed: %v", err)
	// }

	// var ids = make([]string, 0)
	// var rowCount int32
	// for rows.Next() {
	// 	var n string
	// 	if err := rows.Scan(&n); err != nil {
	// 		fmt.Printf("Row scan failed: %v", err)
	// 	}
	// 	ids = append(ids, n)
	// 	rowCount++
	// }
	// if err := rows.Err(); err != nil {
	// 	fmt.Fprintf(os.Stderr, "Rows.Scan failed: %v\n", err)
	// }

	// for _, id := range ids {
	// 	fmt.Println(id)
	// }

	// ids := make([]string, 0)
	// rows, err := conn.Query(context.Background(), "select url from images")
	// if err != nil {
	// 	fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	// 	os.Exit(1)
	// }
	// fmt.Println(rows)
	// //defer rows.Close()
	// for rows.Next() {
	// 	fmt.Println("rows.next()")
	// 	var id string
	// 	if err := rows.Scan(&id); err != nil {
	// 		// Check for a scan error.
	// 		// Query rows will be closed with defer.
	// 		fmt.Println("row scan error:")
	// 		fmt.Println(err)
	// 		log.Fatal(err)
	// 	}
	// 	ids = append(ids, id)
	// 	fmt.Println("appending id:")
	// 	fmt.Println(id)
	// }
	// fmt.Println("ids is:")
	// for _, id := range ids {
	// 	fmt.Println(id)
	// }

	// urls := make([]string, 0)
	// rows, err := conn.Query(context.Background(), "SELECT url FROM images")

	// var url string
	// if err := rows.Scan(&url); err != nil {
	// 	// Check for a scan error.
	// 	// Query rows will be closed with defer.
	// 	fmt.Println(err)
	// }
	// urls = append(urls, url)

	// for i := 0; i < 10; i++ {
	// 	fmt.Println(urls[0])
	// }

	// fmt.Println(urls)

	// if err != nil {
	// 	return err
	// }
	// defer rows.Close()

	// for rows.Next() {
	// 	err = rows.Scan(&urls)
	// 	if err != nil {
	// 		return nil, err
	// 	}

	// 	err = f(rows)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// }

	// if err := rows.Err(); err != nil {
	// 	return nil, err
	// }

	// test code

	// rows, err := conn.QueryContext(context.Background(), "SELECT url FROM images")
	// if err != nil {
	// 	fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
	// }
	// defer rows.Close()
	// urls := make([]string, 0)

	// for rows.Next() {
	// 	var url string
	// 	if err := rows.Scan(&url); err != nil {
	// 		// Check for a scan error.
	// 		// Query rows will be closed with defer.
	// 		fmt.Fprintf(os.Stderr, "Scan error: %v\n", err)
	// 	}
	// 	urls = append(urls, url)
	// }

	// // Rows.Err will report the last error encountered by Rows.Scan.
	// if err := rows.Err(); err != nil {
	// 	fmt.Fprintf(os.Stderr, "Rows.Scan failed: %v\n", err)
	// }
	// fmt.Printf("%s are years old", strings.Join(urls, ", "))

	// end of test code

	r := gin.Default()
	r.LoadHTMLGlob("../public/index.html")
	r.Static("build", "../public/build")
	r.Static("images", "../public/images")
	r.Static("sounds", "../public/sounds")
	r.StaticFile("favicon-16x16.png", "../public/favicon-16x16.png")
	r.StaticFile("favicon-32x32.png", "../public/favicon-32x32.png")
	r.StaticFile("site.webmanifest", "../public/site.webmanifest")
	r.StaticFile("global.css", "../public/global.css")
	r.StaticFile("favicon.ico", "../public/favicon.ico")
	r.StaticFile("apple-touch-icon.png", "../public/apple-touch-icon.png")
	r.StaticFile("android-chrome-192x192.png", "../public/android-chrome-192x192.png")
	r.StaticFile("android-chrome-512x512.png", "../public/android-chrome-512x512.png")

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.GET("/user/:name", func(c *gin.Context) {
		name := c.Param("name")
		c.String(http.StatusOK, "Hello %s", name)
	})

	// func (date time.Time) String() string {
	//     return fmt.Sprintf("%b", b)
	// }

	// t, _ = time.Parse(time.RFC3339, date)

	r.GET("/index", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": blog.Title,
			"date":  blog.Date,
			"body":  blog.Body,
		})
	})

	// r.GET("/blogposts", func(c *gin.Context) {
	// 	c.JSON(200, gin.H{
	// 		"title":  blog.Title,
	// 		"date":   blog.Date,
	// 		"body":   blog.Body,
	// 		"image":  blog.Image,
	// 		"places": places,
	// 	})
	// })

	r.POST("/post", func(c *gin.Context) {
		id := c.Query("id")
		page := c.DefaultQuery("page", "0")
		name := c.PostForm("name")
		message := c.PostForm("message")

		fmt.Printf("id: %s; page: %s; name: %s; message: %s", id, page, name, message)
	})

	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
