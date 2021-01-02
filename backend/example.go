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
)

type Blog struct {
	ID    int `db:"id"`
	Title string
	Date  time.Time
	Body  string
	Image string
}

func main() {
	dbpwd := os.Getenv("DBPWD")

	db, err := sqlx.Connect("postgres", "user=postgres dbname=postgres  sslmode=disable password="+dbpwd)
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

	r.GET("/index", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index.html", gin.H{
			"title": blog.Title,
			"date":  blog.Date,
			"body":  blog.Body,
		})
	})

	r.GET("/blogposts", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"title":  blog.Title,
			"date":   blog.Date,
			"body":   blog.Body,
			"image":  blog.Image,
			"places": places,
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
