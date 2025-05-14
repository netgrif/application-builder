export default class Application {
    // TODO validácie
    public appMeta: string = 'application';
    public id: string; // TODO doplniť o identifikátor a tak aby prešiel cez sanitáciu
    public name: string;
    public description: string = '';
    public version: string = '1.0.0';
    public author: string;
    public tags: Array<string> = [];
    public processes: Array<string> = [];

    constructor(name: string, description: string = '', version: string = '1.0.0') {
        this.name = name;
        this.description = description;
        this.version = version;
    }

    public static getEmpty(): Application {
        return new Application('New Application');
    }

}
