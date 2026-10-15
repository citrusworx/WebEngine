class Post {
    private title!: string;
    private author!: string;
    private description!: string;
    private slug!: string;
    private content!: string;
    private tags = <string[]>[];
    private categoires = <string[]>[];
    private comments = <string[]>[];
    private likes!: number;
    private shares!: number;


    __constructor(title: string, author: string){
        this.title = title;
        this.author = author;
    }

    getTitle(){
        return this.title;
    }

    setTitle(title: string){
        this.title = title;
    }

    getAuthor(){
        return this.author;
    }

    setAuthor(author: string){
        this.author = author;
    }

    getDescription(){
        return this.description;
    }

    setDescription(desc: string){
        this.description = desc;
    }

    getSlug(){
        return this.slug;
    }

    setSlug(slug: string){
        this.slug = slug;
    }

    getContent(){
        return this.content;
    }

    setContent(content: string){
        this.content = content;
    }

    getComments(){
        return this.comments;
    }

    addComment(comment: string){
        this.comments.push(comment);
    }

    getTages(){
        return this.tags;
    }

    addTag(tag: string){
        this.tags.push(tag);
    }

    getLikes(){
        return this.likes;
    }

    addLike(like:number){
        this.likes += like;
    }

    getShares(){
        return this.shares;
    }

    addShare(share: number){
        this.shares += share;
    }

    getCategories(){
        return this.categoires;
    }

    addCategory(cat: string){
        this.categoires.push(cat);
    }
}

export {Post}