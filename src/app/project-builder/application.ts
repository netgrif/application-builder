export default class Application {
    // TODO validácie
    public appMeta: string = 'application';
    public id: string;
    public name: string;
    public description: string;
    public version: string;
    public author: string;
    public tags: Array<string> = [];
    public processes: Array<string> = [];

    constructor(id: string, name: string, description: string, version: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.version = version;
    }

    public static getEmpty(): Application {
        return new Application('new_application', 'New Application', '', '1.0.0');
    }
}
