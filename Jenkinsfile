pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = "jatin44/node-app01"
        GIT_SHA = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Setup Node & Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        // stage('Run Tests') {
        //     steps {
        //         dir('backend') {
        //             sh 'npm test'
        //         }
        //     }
        // }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                      echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                  docker build -t ${DOCKER_IMAGE}:${GIT_SHA} backend
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                sh """
                  docker push ${DOCKER_IMAGE}:${GIT_SHA}
                """
            }
        }

        stage('Helm Lint') {
            steps {
                sh '''
                  docker run --rm \
                -v $PWD:/workdir \
                -w /workdir \
                alpine/helm:3.14.0 \
                lint k8-charts/backend-chart
                '''
            }
        }

        stage('Update Helm Image Tag (GitOps)') {
            steps {
                sh """
                  sed -i 's/tag:.*/tag: "${GIT_SHA}"/' k8-charts/backend-chart/values.yaml
                """
            }
        }

        stage('Commit Helm Changes') {
            steps {
                sh '''
                  git checkout main
                  git config user.name "jenkins"
                  git config user.email "jenkins@ci.local"
                  git add k8-charts/backend-chart/values.yaml
                  git commit -m "ci: update node-app image to ${GIT_SHA}"
                  git push origin main
                '''
            }
        }
    }
}
