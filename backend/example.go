package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"fmt"
	"os"
	"github.com/jackc/pgx/v4"
	"context"
	"time"
	// "strings"
	// "github.com/jackc/pgproto3/v2"
	"log"
)

func main() {
	os.Setenv("DATABASE_URL", "postgresql://localhost/postgres")
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	var id int
	var date time.Time
	var title string
	var body string
	var image string
	err = conn.QueryRow(context.Background(), "select id, date, title, body, image from blogs").Scan(&id, &date, &title, &body, &image)
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
		os.Exit(1)
	}

	ids := make([]string, 0)
	rows, err := conn.Query(context.Background(), "select url from images")
	if err != nil {
		fmt.Fprintf(os.Stderr, "QueryRow failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Println(rows)
	defer rows.Close()
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			// Check for a scan error.
			// Query rows will be closed with defer.
			fmt.Println(err)
			log.Fatal(err)
		}
		ids = append(ids, id)
		fmt.Println(id)
	}
	fmt.Println(ids)

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
			"title": title,
			"date": date,
			"body": body,
		})
	})

	r.GET("/blogposts", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"title": title,
			"date": date,
			"body": body,
			"image": image,
		})
	})

	r.POST("/post", func(c *gin.Context) {
		id := c.Query("id")
		page := c.DefaultQuery("page", "0")
		name := c.PostForm("name")
		message := c.PostForm("message")

		fmt.Printf("id: %s; page: %s; name: %s; message: %s", id, page, name, message)
	})

	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}