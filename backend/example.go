package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"fmt"
	"os"
	"github.com/jackc/pgx/v4"
	"context"
	"time"
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

	fmt.Println(title)

	r := gin.Default()
	r.LoadHTMLGlob("../public/index.html")
	r.Static("build", "../public/build")
	r.Static("images", "../public/images")
	r.Static("sounds", "../public/sounds")
	r.StaticFile("favicon-16x16.png", "../public/favicon-16x16.png")
	r.StaticFile("favicon-32x32.png", "../public/favicon-32x32.png")
	r.StaticFile("site.webmanifest", "../public/site.webmanifest")
	r.StaticFile("global.css", "../public/global.css")

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