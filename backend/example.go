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

	r.GET("/api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.GET("/api/user/:name", func(c *gin.Context) {
		name := c.Param("name")
		c.String(http.StatusOK, "Hello %s", name)
	})

	r.GET("/api/blogposts", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"title":  blog.Title,
			"date":   blog.Date,
			"body":   blog.Body,
			"image":  blog.Image,
			"places": places,
		})
	})

	r.POST("/api/post", func(c *gin.Context) {
		id := c.Query("id")
		page := c.DefaultQuery("page", "0")
		name := c.PostForm("name")
		message := c.PostForm("message")

		fmt.Printf("id: %s; page: %s; name: %s; message: %s", id, page, name, message)
	})

	r.Run() // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
