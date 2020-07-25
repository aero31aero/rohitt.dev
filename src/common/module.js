const ENDPOINT = 'https://jsonplaceholder.typicode.com/users/';

export function getUsers() {
    throw new Error('HELLO');
    return fetch(ENDPOINT)
        .then((response) => {
            if (!response.ok) throw Error(response.statusText);
            return response.json();
        })
        .then((json) => json);
}
