import { faker } from 'npm:@faker-js/faker';

function createValue() {
    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            country: faker.location.country(),
        },
    };
}


function createArray(max: number) {
    const array = [];
    for (let i = 0; i < max; i++) {
        array.push(createValue());
    }
    return array;
}



function createJson(filename: string) {
    const data = createArray(1e3);
    const json = JSON.stringify(data, null, 2);
    Deno.writeTextFileSync(filename, json)
}

createJson('fixtures/1e3.json');