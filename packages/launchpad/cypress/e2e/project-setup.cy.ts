describe('Launchpad: Setup Project', () => {
  beforeEach(() => {
    cy.scaffoldProject('pristine') // not configured
    cy.scaffoldProject('pristine-with-ct-testing') // component configured
    cy.scaffoldProject('pristine-with-e2e-testing') // e2e configured
  })

  const verifyWelcomePage = ({ e2eIsConfigured, ctIsConfigured }) => {
    cy.contains('Welcome to Cypress!').should('be.visible')
    cy.contains('[data-cy-testingtype="e2e"]', e2eIsConfigured ? 'Configured' : 'Not Configured')
    cy.contains('[data-cy-testingtype="component"]', ctIsConfigured ? 'Configured' : 'Not Configured')
  }

  it('no initial setup displays welcome page', () => {
    cy.openProject('pristine')
    cy.visitLaunchpad()
    cy.contains('Welcome to Cypress!').should('be.visible')
    verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
  })

  describe('from global mode', () => {
    beforeEach(() => {
      cy.scaffoldProject('pristine')
      cy.openGlobalMode()
      cy.addProject('pristine')
      cy.visitLaunchpad()
    })

    it('scaffolds a project, go back to global screen, and state is cleared', () => {
      cy.get('[data-cy=project-card]').click()
      cy.get('[data-cy-testingtype="e2e"]').click()
      cy.get('h1').should('contain', 'Configuration Files')
      cy.get('[data-cy="global-mode-link"]').click()
      cy.get('[data-cy=project-card]').click()
      cy.get('h1').should('contain', 'Welcome to Cypress!')
      cy.get('[data-cy-testingtype="e2e"]').should('not.contain', 'Not Configured')
      cy.get('[data-cy-testingtype="e2e"]').click()
      cy.get('h1').should('contain', 'Choose a Browser')
    })

    it('does not show loading browsers interim before scaffolding screen', () => {
      const resolutionDelay = 1000

      cy.withCtx((ctx, o) => {
        const stub = o.sinon.stub(ctx.actions.wizard, 'scaffoldTestingType')

        // Force the resolution of the scaffolding testing types to simulate
        // the failing state in the assertion below
        stub.callsFake(async () => {
          await new Promise((resolve) => setTimeout(resolve, o.resolutionDelay))
          stub.restore()

          return ctx.actions.wizard.scaffoldTestingType()
        })
      }, { resolutionDelay })

      cy.get('[data-cy=project-card]').click()
      cy.get('[data-cy-testingtype="e2e"]').click()
      cy.get('[data-cy-testingtype="e2e"]').should('not.exist')
      cy.get('body', { timeout: resolutionDelay / 2 }).should('not.contain', 'Choose a Browser')
      cy.get('[data-e2e="spin"]')
      cy.get('h1').should('contain', 'Configuration Files')
    })
  })

  describe('"learn about testing types" modal', () => {
    beforeEach(() => {
      cy.openProject('pristine')
      cy.visitLaunchpad()
      verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })
    })

    it('welcome page has "learn about testing types" link which opens modal', () => {
      cy.contains('Review the differences').click()

      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' }).should('be.visible')
      cy.contains('Need help?').should('be.visible')

      cy.get('[data-cy="end-to-end-comparison"]').within(() => {
        cy.contains('End-to-end Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })

      cy.get('[data-cy="component-comparison"]').within(() => {
        cy.contains('Component Tests').should('be.visible')
        cy.get('li').should('have.length', 3)
        cy.contains('Code Example').should('be.visible')
      })
    })

    it('close modal with escape key', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.findByRole('dialog', { name: 'Key Differences' }).should('be.visible')
      cy.get('body').type('{esc}')
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('closes modal by clicking outside of modal', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')
      cy.findByRole('dialog', { name: 'Key Differences' }).should('be.visible')
      cy.get('body').click(5, 5)
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    it('closes modal by clicking close button', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .should('be.visible')
      .within(() => {
        cy.get('h2').contains('Key Differences').should('be.visible')
      })

      cy.findByRole('button', { name: 'Close' }).click()
      // cy.get('[aria-label=Close]').click()
      cy.get('#app').should('not.have.attr', 'aria-hidden')
    })

    // FIXME: enter key down isn't trigger close callback. working correctly when manually tested.
    // could be related to this bug? https://github.com/cypress-io/cypress/issues/14864
    it.skip('closes modal by pressing enter key when close button is focused', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .as('aboutTestingTypes')
      .should('be.visible')
      .within(() => {
        cy.get('h2').contains('Key Differences').should('be.visible')

        // @ts-ignore
        cy.get('body').tab()

        cy.findByRole('button', { name: 'Close' })
        .should('have.focus')
        .type('{enter}')
      })

      cy.get('#app').should('not.have.attr', 'aria-hidden')
      cy.get('@aboutTestTypes').should('not.be.visible')
    })

    it('clicking "Need Help?" links to Cypress documentation', () => {
      cy.contains('Review the differences').click()
      cy.get('#app').should('have.attr', 'aria-hidden', 'true')

      cy.findByRole('dialog', { name: 'Key Differences' })
      .should('be.visible')
      .within(() => {
        cy.validateExternalLink({
          name: 'Need help?',
          href: 'https://on.cypress.io',
        })
      })
    })
  })

  describe('E2E test setup', () => {
    describe('project has been configured for e2e', () => {
      it('skips the setup page when choosing e2e tests to run', () => {
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('opens to the browser pages when opened via cli with --e2e flag', () => {
        cy.openProject('pristine-with-e2e-testing', ['--e2e'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Choose a Browser')
      })
    })

    // project has a cypress.configuration file with component testing configured
    describe('project that has not been configured for e2e', () => {
      it('shows existing files as skipped when scaffolding e2e', () => {
        const scaffoldingPaths = {
          fixture: ['cypress/fixtures/example.json', '{}'],
          support: ['cypress/support/e2e.js', '// FooBarBaz'],
        } as const

        cy.openProject('pristine')
        cy.withCtx((ctx, o) => {
          ctx.actions.file.writeFileInProject(...o.scaffoldingPaths.support)
          ctx.actions.file.writeFileInProject(...o.scaffoldingPaths.fixture)
        }, { scaffoldingPaths })

        cy.visitLaunchpad()
        cy.get('[data-cy-testingtype="e2e"]').click()

        for (const [path, contents] of Object.values(scaffoldingPaths)) {
          cy.contains('h2', path)
          .parents('[data-cy="collapsible-header"]')
          .should('contain', 'Skipped')
          .should('have.attr', 'aria-expanded', 'false')
          .parent()
          .contains(contents)
          .should('not.be.visible')

          cy.contains('h2', path).click()
          .parents('[data-cy="collapsible-header"]')
          .should('have.attr', 'aria-expanded', 'true')
          .parent()
          .contains(contents)
        }
      })

      it('shows the first step in configuration when selecting e2e tests', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })
      })

      it('moves to "Choose a Browser" page after clicking "Continue" button in first step in configuration page', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="e2e"]').click()

        cy.contains('h1', 'Configuration Files')
        cy.findByText('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })
      })

      it('shows the first step in configuration when opened via cli with --e2e flag', () => {
        cy.openProject('pristine-with-ct-testing', ['--e2e'])
        cy.visitLaunchpad()

        cy.contains('h1', 'Configuration Files')
        cy.contains('We added the following files to your project.')

        cy.get('[data-cy=changes]').within(() => {
          cy.contains('cypress.config.js')
        })

        cy.get('[data-cy=valid]').within(() => {
          cy.contains('cypress/support/e2e.js')
          cy.contains('cypress/fixtures/example.json')
        })
      })
    })

    it('can setup e2e testing for a project not been configured for cypress', () => {
      cy.openProject('pristine')
      cy.visitLaunchpad()

      verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

      // @ts-ignore
      cy.get('body').tab()

      cy.get('[data-cy-testingtype="e2e"]')
      .should('have.focus')
      .type('{enter}')

      cy.contains('h1', 'Configuration Files')
      cy.findByText('We added the following files to your project.')

      cy.get('[data-cy=valid]').within(() => {
        cy.contains('cypress.config.js')
        cy.contains('cypress/support/e2e.js')
        cy.contains('cypress/fixtures/example.json')
      })
    })
  })

  describe('Component setup', () => {
    describe('project has been configured for component testing', () => {
      it('it skips the setup page when choosing component tests to run', () => {
        cy.openProject('pristine-with-ct-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: true })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.contains(/(Initializing Config|Choose a Browser)/)
      })

      it('opens to the browser pages when opened via cli with --component flag', () => {
        cy.openProject('pristine-with-ct-testing', ['--component'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Choose a Browser')
      })
    })

    describe('project that has not been configured for component testing', () => {
      it('shows the "choose framework" page when selecting component tests', () => {
        cy.openProject('pristine-with-e2e-testing')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: true, ctIsConfigured: false })

        cy.get('[data-cy-testingtype="component"]').click()

        cy.get('h1').should('contain', 'Project Setup')
        cy.contains('Confirm the front-end framework and bundler used in your project.')
      })

      it('opens to the "choose framework" page when opened via cli with --component flag', () => {
        cy.openProject('pristine-with-e2e-testing', ['--component'])
        cy.visitLaunchpad()

        cy.get('h1').should('contain', 'Project Setup')
        cy.contains('Confirm the front-end framework and bundler used in your project.')
      })
    })

    describe('project not been configured for cypress', () => {
      it('can setup component testing for a project not been configured for cypress', () => {
        cy.openProject('pristine')
        cy.visitLaunchpad()

        verifyWelcomePage({ e2eIsConfigured: false, ctIsConfigured: false })

        // @ts-ignore
        cy.get('body').tab().tab()

        cy.get('[data-cy-testingtype="component"]')
        .should('have.focus')
        .type('{enter}')

        cy.findByText('Confirm the front-end framework and bundler used in your project.')
      })
    })
  })
})
