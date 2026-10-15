class Post {
    static title;
    static slug;
    static description;
    static date;
    static author;
    static content;
    static tags;
    static comments;
    static likes;
    static shares;

    getTitle(){
        return this.title;
    }

    setTitle(newTitle){
        this.title = newTitle;
    }

    getSlug(){
        return this.slug;
    }

    setSlug(newSlug){
        this.slug = newSlug;
    }

    getDescription(){
        return this.description;
    }

    setDescription(newDesc){
        this.description = newDesc;
    }

    getAuthor(){
        return this.author;
    }

    setAuthor(newAuthor){
        this.author = newAuthor;
    }

    getDate(){
        return this.date;
    }

    setDate(newDate){
        this.date = newDate;
    }

    getContent(){
        return this.content;
    }

    setContent(content){
        this.content = content;
    }

    getComments(){
        return this.comments;
    }

    setComments(comments, comment){
        this.comments = [...comments, comment];
    }

    getLikes(){
        return this.likes;
    }
        
    setLikes(likes, like){
        this.likes = [...likes, like]
    }

    getShares(){
        return this.shares;
    }

    setShares(shares, share){
        this.shares = [...shares, share];
    }

    getTags(){
        return this.tags;
    }

    setTags(tags, tag){
        this.tags = [...tags, tag];
    }
}

export default Post;