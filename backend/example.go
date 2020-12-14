package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"fmt"
	"os"
	"github.com/jackc/pgx/v4"
	"context"
)

func main() {
	os.Setenv("DATABASE_URL", "postgresql://localhost/postgres")
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	var title string
	err = conn.QueryRow(context.Background(), "select title from blogs").Scan(&title)
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

	r.GET("/index", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": "Main website",
			"subtitle": title,
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