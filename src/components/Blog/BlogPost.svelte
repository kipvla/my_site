<script>
    // export let title = "My first post";
    // export let date = "Friday November 13, 2020";
    // export let time = "4:00 PM";
    // export let image = "images/KR11.jpg";
    // export let body = "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Assumenda ducimus distinctio necessitatibus quo repellendus sed explicabo eveniet, omnis blanditiis reiciendis amet perferendis, quod minima consequatur dolores eius, cumque repudiandae praesentium?";
    // const fetchImage = (async () => {
    //     const response = await fetch("http://localhost:8080/blogposts")
    //         .then(data => { console.log(data); return data; })
    //         .catch(data => { console.log(data); return data; })
    //     return response.json();
    // })()
    const dateFormat = date => date.toString().split(/-|T|:/);
    const fetchBlogs = fetch("http://localhost:8080/blogposts")
            .then(data => { console.log(data); return data.json()} )
            .catch(data => { console.log(data); return data.json()});
</script>


<div class="container">
    <div class="col col-lg-2"></div>
    <div class="col col-lg-8 blog-post">
        {#await fetchBlogs}
            <p>...waiting</p>
        {:then data}
            <!-- svelte-ignore a11y-img-redundant-alt -->
            <h2>{data.title}</h2>
            <img class="blog-image" src="{data.image}" alt="">
            <h5>{`${dateFormat(data.date)[3]}: ${dateFormat(data.date)[4]}, ${dateFormat(data.date)[1]}/${dateFormat(data.date)[2]}/${dateFormat(data.date)[0]}`}</h5>
            <!-- <h5>{data.time}</h5> -->
            <p class="justify-content-center">{data.body}</p>
        {:catch error}
            <p>An error occurred!  {`${error}`}</p>
        {/await}
    </div>
    <div class="col col-lg-2"></div>
    <hr>
</div>