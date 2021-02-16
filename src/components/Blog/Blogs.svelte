<script>
    // import {Router, Route} from 'svelte-routing'
// import BlogPost from './BlogPost.svelte'
import Post1 from './Posts/Post1.svelte'

    const fetchBlogs = fetch(`/api/blogposts`)
        .then((data) => {
            console.log('succ', data);
            return data.json();
        })
        .catch((data) => {
            console.log('error', data);
            return data;
        });
</script>

<!-- <Router>
    <Router path="/blogs/1" component={Post1}/>
</Router> -->

<Post1 short={true}/>

<!-- {#await fetchBlogs}
    <div class="container d-flex justify-content-center mt-5">
        <p class='m-5 p-5'>writing posts...</p>
    </div>
{:then data}
    {#each data.places as place}
       <BlogPost {...place} />
    {/each}
{:catch error}
    <p>An error occurred! {`${error}`}</p>
{/await} -->