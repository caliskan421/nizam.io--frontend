// nizamio-e2e-bootstrap — YALNIZ web e2e ortamı için ilk yönetici kurulumu.
//
// NEDEN VAR: backend `cmd/setup` aktivasyon kodu ister; sahte merkez adaptöründe kod
// yalnız süreç içinde (Go test harness'ı) üretilebilir (backend README "Bugünkü sınır").
// Bu araç backend entegrasyon düzeneğinin (internal/composition/compositiontest) yaptığını
// aynen, DIŞA AÇIK composition API'siyle yapar:
//  1. sahte merkez kurulumun yapılandırılmış kimliğini verir ve tek kullanımlık kod üretir,
//     `Provisioning().Activate` GERÇEK aktivasyon akışını koşar (aktivasyonsuz kurulum salt
//     okunurdur: provisioning.write_not_allowed);
//  2. `Root.Bootstrap` (D-0067: identity ilk yönetici + organization şirket kaydı).
//
// İmaj digest adımı yoktur. Üretim kurulumu değildir; backend deposuna yazılmaz — betik bu
// dosyayı etiketten çıkarılmış geçici kaynak ağacına kopyalayıp derler.
//
// Parola yalnız standart girdiden okunur (backend setup ile aynı ilke).
package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/caliskan421/nizam.io--backend/internal/composition"
	provusecase "github.com/caliskan421/nizam.io--backend/internal/modules/provisioning/usecase"
	"github.com/caliskan421/nizam.io--backend/internal/platform/config"
)

func main() { os.Exit(run()) }

func run() int {
	fs := flag.NewFlagSet("nizamio-e2e-bootstrap", flag.ContinueOnError)
	adminEmail := fs.String("admin-email", "", "ilk yöneticinin e-postası (zorunlu)")
	companyName := fs.String("company-name", "", "şirketin görünen adı (zorunlu)")
	if err := fs.Parse(os.Args[1:]); err != nil {
		return 2
	}
	if strings.TrimSpace(*adminEmail) == "" || strings.TrimSpace(*companyName) == "" {
		fmt.Fprintln(os.Stderr, "e2e-bootstrap: --admin-email ve --company-name zorunlu")
		return 2
	}

	sc := bufio.NewScanner(os.Stdin)
	if !sc.Scan() || strings.TrimSpace(sc.Text()) == "" {
		fmt.Fprintln(os.Stderr, "e2e-bootstrap: yönetici parolası standart girdiden okunamadı")
		return 2
	}
	password := strings.TrimSpace(sc.Text())

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 2
	}
	ctx := context.Background()
	root, err := composition.New(ctx, cfg, composition.Options{})
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	defer root.Close()

	fake := root.FakeControlPlaneAdaptor()
	if fake == nil {
		fmt.Fprintln(os.Stderr, "e2e-bootstrap: sahte kontrol düzlemi bağlı değil (NIZAMIO_CONTROL_PLANE_ADAPTER=fake gerekli)")
		return 2
	}
	fake.SetNextInstanceID(cfg.String(config.InstanceID))
	activation, err := root.Provisioning().Activate.Execute(ctx,
		provusecase.ActivationInput{ActivationCode: fake.IssueActivationCode()})
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	fmt.Printf("e2e-bootstrap: aktivasyon instance=%s yeni=%t zaten=%t\n",
		activation.InstanceID, activation.Activated, activation.AlreadyActivated)

	report, err := root.Bootstrap(ctx, composition.SetupInput{
		AdminEmail:         *adminEmail,
		AdminPassword:      password,
		CompanyDisplayName: *companyName,
	})
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	fmt.Printf("e2e-bootstrap: hesap=%s yeni=%t şirket=%s yeni=%t yönetici-atandı=%t\n",
		report.AccountID, report.AccountCreated, report.CompanyID, report.CompanyCreated, report.AdminGranted)
	return 0
}
