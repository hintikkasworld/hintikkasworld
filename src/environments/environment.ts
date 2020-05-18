// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,

    agents: ['a', 'b', 'c', 'd'],
    agentColor: { a: '#ED5D1B', b: '#80AAFF', c: '#72267C', d: '#008800' },
    agentImageURL: {
        a: 'assets/img/agenta.png',
        b: 'assets/img/agentb.png',
        c: 'assets/img/agentc.png',
        d: 'assets/img/agentd.png'
    }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
